import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useInventory } from '@/contexts/InventoryContext';
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
} from 'lucide-react';
import './BarcodeScanner.css';

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
}

export default function BarcodeScannerComponent() {
  const { getProductByBarcode, updateProductQuantity } = useInventory();
  const { toast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProductData | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error('Scanner cleanup failed:', err));
        scannerRef.current = null;
      }
    };
  }, []);

  const startWebScanning = async () => {
    try {
      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        throw new Error('QR reader element not found');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      };

      const scanner = new Html5QrcodeScanner('qr-reader', config, false);

      await scanner.render(
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (error) => {
          console.warn('Scan error:', error);
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
      toast({
        title: 'Scanner Started',
        description: 'Position the barcode in the frame.',
      });
    } catch (error) {
      console.error('Failed to start web scanner:', error);
      toast({
        title: 'Scanner Error',
        description: 'Failed to start scanner. Ensure camera permissions are granted.',
        variant: 'destructive',
      });
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
        console.log('Web scanner stopped');
      }
      setIsScanning(false);
      toast({
        title: 'Scanner Stopped',
        description: 'Camera scanner has been stopped.',
      });
    } catch (error) {
      console.error('Error stopping scanner:', error);
      toast({
        title: 'Scanner Error',
        description: 'Failed to stop scanner.',
        variant: 'destructive',
      });
    }
  };

  const handleScanSuccess = async (barcode: string) => {
    try {
      const product = await getProductByBarcode(barcode);
      if (
        product &&
        typeof product.minStock !== 'undefined' &&
        typeof product.createdAt !== 'undefined' &&
        typeof product.updatedAt !== 'undefined'
      ) {
        setScannedProduct({
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            quantity: product.quantity,
            price: product.price,
            category: product.category,
            minStock: product.minStock,
            description: product.description,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          },
          action: 'restock',
          quantity: 1,
        });
        setRecentScans((prev) => [barcode, ...prev.slice(0, 4)]);
        toast({
          title: 'Product Found!',
          description: `Scanned ${product.name} (Barcode: ${barcode})`,
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
      const { product, action, quantity } = scannedProduct;
      const newQuantity = action === 'restock'
        ? product.quantity + quantity
        : Math.max(0, product.quantity - quantity);

      await updateProductQuantity(String(product.id), newQuantity);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Barcode Scanner</h1>
        <p className="text-muted-foreground">
          Scan product barcodes to quickly update inventory
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Camera Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full max-w-md mx-auto">
              <div
                id="qr-reader"
                className={`w-full h-64 ${!isScanning ? 'hidden' : 'block'}`}
              ></div>
              {isScanning && (
                <div className="scanner-overlay">
                  <div className="center-line"></div>
                </div>
              )}
            </div>
            {!isScanning ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Click to start scanning barcodes with your camera
                </p>
                <Button onClick={startWebScanning} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera Scanner
                </Button>
              </div>
            ) : (
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
            )}
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
                <Button onClick={handleUpdateInventory} className="flex-1">
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
              <h3 className="font-medium">3. Update Stock</h3>
              <p className="text-sm text-muted-foreground">
                Choose to restock or reduce quantity and confirm
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}