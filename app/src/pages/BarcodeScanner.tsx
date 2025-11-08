import { useState, useEffect, useRef } from 'react';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { BarcodeScanner as MLKitBarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import api from '@/utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ScanLine,
  Package,
  Camera,
  CameraOff,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import '/src/components/BarcodeScanner.css';

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  quantity: number;
  price: number;
  category: string;
  minStock: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScannedProductData {
  product: Product;
  action: 'restock' | 'reduce';
  quantity: number;
  geminiSummary?: string;
  geminiFeedback?: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Add to .env: VITE_GEMINI_API_KEY=your_key_here
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export default function BarcodeScannerComponent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProductData | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const cameraPreviewRef = useRef<HTMLDivElement>(null);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setError(null);
      try {
        const res = await api.get('api/products/');
        const mappedProducts: Product[] = (res.data.results || res.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode || '',
          quantity: parseInt(p.quantity),
          price: parseFloat(p.price),
          category: p.category_name || p.category || '',
          minStock: parseInt(p.min_stock),
          description: p.description || '',
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
        setProducts(mappedProducts);
      } catch (err: any) {
        console.error('API Response:', err);
        setError('Failed to fetch products');
        toast({
          title: 'Error',
          description: 'Failed to load products for scanning.',
          variant: 'destructive',
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, [isScanning]);

  const getProductByBarcode = (barcode: string): Product | undefined => {
    return products.find(p => p.barcode === barcode);
  };

  const updateProductQuantity = async (productId: number, newQuantity: number) => {
    try {
      setUpdatingInventory(true);
      const res = await api.patch(`api/products/${productId}/`, { quantity: newQuantity });
      const updatedProduct: Product = {
        ...products.find(p => p.id === productId)!,
        quantity: newQuantity,
        updatedAt: res.data.updated_at,
      };
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    } catch (err: any) {
      console.error('API Response:', err);
      throw new Error('Failed to update quantity');
    } finally {
      setUpdatingInventory(false);
    }
  };

  const startScanning = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: 'Platform Not Supported',
        description: 'Barcode scanning is only available on native iOS and Android devices.',
        variant: 'destructive',
      });
      return;
    }

    if (loadingProducts) {
      toast({
        title: 'Loading',
        description: 'Please wait for products to load.',
      });
      return;
    }

    try {
      // Check camera permissions
      const { camera } = await MLKitBarcodeScanner.checkPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        const { camera: newCameraStatus } = await MLKitBarcodeScanner.requestPermissions();
        if (newCameraStatus !== 'granted' && newCameraStatus !== 'limited') {
          toast({
            title: 'Permission Denied',
            description: 'Please enable camera permission in your device settings.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Get the dimensions and position of the camera-preview div
      const previewElement = cameraPreviewRef.current;
      if (!previewElement) {
        throw new Error('Camera preview element not found');
      }
      const rect = previewElement.getBoundingClientRect();
      const previewOptions: CameraPreviewOptions = {
        parent: 'camera-preview',
        className: 'camera-preview',
        position: 'rear',
        x: 30,
        y: 225,
        width: 300,
        height: 200,
        toBack: false,
        disableAudio: true,
        enableZoom: false,
      };

      await CameraPreview.start(previewOptions);
      // Start barcode scanning
      await MLKitBarcodeScanner.startScan({
        formats: [
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.Code128,
          BarcodeFormat.QrCode,
        ],
      });
      console.log('Barcode scanner started');

      // Listen for scan results
      const listener = await MLKitBarcodeScanner.addListener('barcodesScanned', async (result) => {
        if (result.barcodes && result.barcodes.length > 0 && result.barcodes[0].rawValue) {
          await handleScanSuccess(result.barcodes[0].rawValue);
          listener.remove();
        }
      });

      setIsScanning(true);
      toast({
        title: 'Scanner Started',
        description: 'Point your camera at a barcode.',
      });
    } catch (error) {
      console.error('Failed to start scanner:', error);
      toast({
        title: 'Scanner Error',
        description: 'Failed to start scanner. Ensure camera permissions are granted.',
        variant: 'destructive',
      });
    }
  };

  const stopScanning = async () => {
    try {
      await CameraPreview.stop();
      await MLKitBarcodeScanner.stopScan();
      await MLKitBarcodeScanner.removeAllListeners();
      setIsScanning(false);
      toast({
        title: 'Scanner Stopped',
        description: 'Camera scanner has been stopped.',
      });
    } catch (error) {
      console.error('Error stopping scanner:', error);
      toast({
        title: 'Scanner Error',
        description: `Failed to stop scanner.${error}`,
        variant: 'destructive',
      });
    }
  };

  const analyzeWithGemini = async (product: Product) => {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    setAnalyzing(true);
    try {
      const prompt = `
        Analyze this product inventory data:
        - Product Name: ${product.name}
        - Current Stock: ${product.quantity}
        - Minimum Stock Level: ${product.minStock}
        - Price: $${product.price}
        - Category: ${product.category}
        - SKU: ${product.sku}

        Provide:
        1. A brief summary of the current stock status.
        2. Actionable feedback (e.g., restock recommendation, if low stock).
        3. Keep response concise (under 150 words).

        Format as:
        Summary: [brief summary]
        Feedback: [actionable advice]
      `;

      const response = await axios.post(GEMINI_API_URL, {
        contents: [{ parts: [{ text: prompt }] }],
      }, {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
      });

      const geminiText = response.data.candidates[0].content.parts[0].text;
      const [summary, feedback] = geminiText.split('Feedback:');
      return {
        geminiSummary: summary.replace('Summary: ', '').trim(),
        geminiFeedback: feedback ? feedback.trim() : '',
      };
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      throw new Error('Failed to analyze with AI. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleScanSuccess = async (barcode: string) => {
    try {
      const product = getProductByBarcode(barcode);
      if (product) {
        // Analyze with Gemini
        try {
          const { geminiSummary, geminiFeedback } = await analyzeWithGemini(product);
          setScannedProduct({
            product,
            action: 'restock',
            quantity: 1,
            geminiSummary,
            geminiFeedback,
          });
        } catch (aiError) {
          toast({
            title: 'AI Analysis Failed',
            description: 'Product found but AI analysis unavailable. Proceeding without it.',
          });
          setScannedProduct({
            product,
            action: 'restock',
            quantity: 1,
          });
        }

        setRecentScans((prev) => [barcode, ...prev.slice(0, 4)]);
        toast({
          title: 'Product Found!',
          description: `Scanned ${product.name} (Barcode: ${barcode}). AI analysis complete.`,
        });
        await stopScanning();
      } else {
        toast({
          title: 'Product Not Found',
          description: `No product found with barcode: ${barcode}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch product. Check your connection or barcode.',
        variant: 'destructive',
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      await handleScanSuccess(manualBarcode.trim());
      setManualBarcode('');
    } else {
      toast({
        title: 'Invalid Barcode',
        description: 'Please enter a valid barcode.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateInventory = async () => {
    if (!scannedProduct) return;

    try {
      setUpdatingInventory(true);
      const { product, action, quantity } = scannedProduct;
      const newQuantity = action === 'restock'
        ? product.quantity + quantity
        : Math.max(0, product.quantity - quantity);

      await updateProductQuantity(product.id, newQuantity);

      toast({
        title: 'Inventory Updated',
        description: `${product.name} quantity updated to ${newQuantity}`,
      });

      setScannedProduct(null);
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update inventory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingInventory(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (scannedProduct && newQuantity > 0) {
      setScannedProduct({
        ...scannedProduct,
        quantity: newQuantity,
      });
    }
  };

  const handleActionChange = (newAction: 'restock' | 'reduce') => {
    if (scannedProduct) {
      setScannedProduct({
        ...scannedProduct,
        action: newAction,
      });
    }
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-2">
        <p className="text-destructive text-center">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="barcode-scanner-container space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Barcode Scanner</h1>
        <p className="text-muted-foreground">
          Scan product barcodes to quickly update inventory with AI-powered insights
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Camera Scanner
            </CardTitle>
            <div className="relative w-full max-w-md mx-auto">
              <div
                id="camera-preview"
                ref={cameraPreviewRef}
                className={`w-full h-[300px] relative bg-black rounded-lg overflow-hidden ${
                  !isScanning ? 'hidden' : 'block'
                } camera-preview`}
              ></div>
              {isScanning && (
                <div className="scanner-overlay">
                  <div className="center-line"></div>
                </div>
              )}
              {!isScanning && !Capacitor.isNativePlatform() && (
                <div className="text-center text-muted-foreground">
                  <p>Barcode scanning is only available on native iOS and Android devices.</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Capacitor.isNativePlatform() && !isScanning ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Click to start scanning barcodes with your camera
                </p>
                <Button onClick={startScanning} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera Scanner
                </Button>
              </div>
            ) : isScanning ? (
              <div className="space-y-4">
                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="w-full"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Stop Scanner
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter Barcode Manually
                </label>
                <Input
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number..."
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!manualBarcode.trim()}>
                <ScanLine className="mr-2 h-4 w-4" />
                Lookup Product
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Recent Scans</h4>
              {recentScans.length > 0 ? (
                <ul className="text-sm text-muted-foreground">
                  {recentScans.map((barcode, index) => (
                    <li key={index} className="py-1">
                      Barcode: {barcode}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No recent scans to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!scannedProduct} onOpenChange={() => setScannedProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Product Found
            </DialogTitle>
          </DialogHeader>

          {scannedProduct && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium text-lg">{scannedProduct.product.name}</h3>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p>Barcode: {scannedProduct.product.barcode}</p>
                  <p>SKU: {scannedProduct.product.sku}</p>
                  <p>Category: {scannedProduct.product.category}</p>
                  <p>Current Stock: {scannedProduct.product.quantity}</p>
                  <p>Price: ${scannedProduct.product.price.toFixed(2)}</p>
                </div>
              </div>

              {/* AI Analysis Section */}
              {scannedProduct.geminiSummary && (
                <div className="bg-secondary p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm">AI Summary</h4>
                  <p className="text-sm text-muted-foreground">{scannedProduct.geminiSummary}</p>
                  <h4 className="font-medium mt-3 mb-2 text-sm">AI Feedback</h4>
                  <p className="text-sm text-muted-foreground">{scannedProduct.geminiFeedback}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-3 block">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={scannedProduct.action === 'restock' ? 'default' : 'outline'}
                    onClick={() => handleActionChange('restock')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Restock
                  </Button>
                  <Button
                    variant={scannedProduct.action === 'reduce' ? 'default' : 'outline'}
                    onClick={() => handleActionChange('reduce')}
                    className="flex items-center gap-2"
                  >
                    <Minus className="h-4 w-4" />
                    Reduce
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(Math.max(1, scannedProduct.quantity - 1))}
                    disabled={scannedProduct.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={scannedProduct.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(scannedProduct.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Current Stock:</span>
                    <span>{scannedProduct.product.quantity}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>New Stock:</span>
                    <span>
                      {scannedProduct.action === 'restock'
                        ? scannedProduct.product.quantity + scannedProduct.quantity
                        : Math.max(0, scannedProduct.product.quantity - scannedProduct.quantity)}
                    </span>
                  </div>
                </div>
              </div>

              {scannedProduct.action === 'reduce' &&
                (scannedProduct.product.quantity - scannedProduct.quantity) <=
                  scannedProduct.product.minStock && (
                  <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span>Warning: This will result in low stock</span>
                  </div>
                )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setScannedProduct(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateInventory} className="flex-1" disabled={updatingInventory || analyzing}>
                  {updatingInventory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Inventory
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>How to Use the Barcode Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">1. Start Scanner</h3>
              <p className="text-sm text-muted-foreground">
                Click "Start Camera Scanner" and allow camera access
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <ScanLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">2. Scan Barcode</h3>
              <p className="text-sm text-muted-foreground">
                Align the barcode with the center line in the frame
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">3. Get AI Insights</h3>
              <p className="text-sm text-muted-foreground">
                Receive AI-powered summary and feedback after scanning
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}